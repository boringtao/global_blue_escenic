(function($) {
    $.fn.fancyAlert = function(config) {
        var htmlElement = $(this);
        function configureFancyAlert() {
            var message =   '<div id="fancy"><div class="fancyDeleteDay">' + config.message + 
                            '<p>' + 
                                '<div class="ibItinDay ibItinDayOn" id="confirmButton">' + config.confirmLabel + '</div>' + 
                                '<div class="ibItinDay ibLeftGap1" id="cancelButton">' + config.cancelLabel + '</div>' +
                            '</p>' + 
                        '</div></div>';

            function _handleConfirm() {
                if (config.onConfirmed != null && typeof config.onConfirmed != 'undefined') {
                    config.onConfirmed();
                }
                $.fancybox.close();
            }
            
            function _handleCancel() {
                if (config.onCancelled != null && typeof config.onCancelled != 'undefined') {
                    config.onCancelled();
                }
                $.fancybox.close();
            }
            
            htmlElement.fancybox({
                hideOnContentClick: false,
                content: message,
                onComplete: function() {
                    $("#confirmButton").click(_handleConfirm);
                    $("#cancelButton").click(_handleCancel);
                }
            });
        }
        
        configureFancyAlert();
    };
})(jQuery);
